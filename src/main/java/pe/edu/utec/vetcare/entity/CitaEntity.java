package pe.edu.utec.vetcare.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.edu.utec.vetcare.enums.EstadoCita;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cita")
public class CitaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cita")
    private Long idCita;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "id_veterinario",
            nullable = false
    )
    private VeterinarioEntity veterinario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "id_mascota",
            nullable = false
    )
    private MascotaEntity mascota;

    @Column(name = "fecha_cita", nullable = false)
    private LocalDateTime fechaCita;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoCita estado;

    @Column(name = "motivo_cita")
    private String motivoCita;
}