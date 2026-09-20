package pe.edu.utec.vetcare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "atenciones")
public class AtencionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_atencion")
    private Integer idAtencion;

    /*
    @ManyToOne
    @JoinColumn(name = "id_historia", nullable = false)
    private HistoriaClinicaEntity historiaClinica;
    */

    // PROVISIONAL
    @Column(name = "id_historia", nullable = false)
    private Integer idHistoria;


    @ManyToOne
    @JoinColumn(name = "id_veterinario_atencion", nullable = false)
    private VeterinarioEntity veterinario;


    @OneToOne
    @JoinColumn(name = "id_cita", nullable = false, unique = true)
    private CitaEntity cita;


    @Column(name = "fecha_atencion", nullable = false)
    private LocalDateTime fechaAtencion;


    @Column(name = "precio_atencion")
    private BigDecimal precioAtencion;


    @Column(name = "peso")
    private BigDecimal peso;


    @Column(name = "sintoma")
    private String sintoma;


    @Column(name = "diagnostico")
    private String diagnostico;


    @Column(name = "tratamiento")
    private String tratamiento;


    @Column(name = "observacion")
    private String observacion;
}