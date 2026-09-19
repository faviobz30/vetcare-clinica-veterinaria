package pe.edu.utec.vetcare.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.edu.utec.vetcare.enums.EstadoCita;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "cita")
public class CitaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cita")
    private Integer idCita;

    @ManyToOne
    @JoinColumn(name = "id_veterinario", nullable = false)
    private VeterinarioEntity veterinario;


    /*
    @ManyToOne
    @JoinColumn(name = "id_mascota")
    private MascotaEntity mascota;
    */

    // PROVISIONAL
    @Column(name = "id_mascota", nullable = false)
    private Integer idMascota;


    @Column(name = "fecha_cita", nullable = false)
    private LocalDateTime fechaCita;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoCita estado;

    @Column(name = "motivo_cita")
    private String motivoCita;
}